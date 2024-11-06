const mongoose= require('mongoose')
const Tarea = require('./Tarea');
const proyectoSchema = new mongoose.Schema({
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    nombre:{type:String,required:true},
    descripcion:{type:String},
    fechaInicio:{type:Date},
    fechaFin:{type:Date},
  
})

proyectoSchema.pre('findOneAndDelete', async function (next) {
    const proyecto = this.getQuery()._id;
    await Tarea.deleteMany({ proyecto });
    next();
});
const Proyecto = mongoose.model('Proyecto', proyectoSchema);

module.exports = Proyecto;
